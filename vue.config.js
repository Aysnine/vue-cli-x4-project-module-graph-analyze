const path = require("path");
const { default: traverse } = require("@babel/traverse");

class AccessDependenciesPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      "AccessDependenciesPlugin",
      (compilation) => {
        compilation.hooks.finishModules.tap(
          "AccessDependenciesPlugin",
          (rawModules) => {
            if (
              rawModules.find(
                (i) => i.resource && i.resource.endsWith("main.js")
              )
            ) {
              const startTime = Date.now();
              console.log("==================== START");

              const normal = (p) => (p ? p.replaceAll("\\", "/") : p);
              const currentProjectPath = normal(path.resolve("./"));
              const reducePath = (absPath) =>
                absPath.replace(currentProjectPath, "");

              const requestModule = rawModules.find((module) => {
                return normal(module.resource)?.endsWith("utils/request.js");
              });

              if (!requestModule) {
                throw new Error("Can't find request module!");
              }

              // console.log(`[At ${(Date.now() - startTime) / 1000}s]`);
              console.log("==================== REQUEST MODULE READY");

              const apiModules = rawModules
                .filter((module) => {
                  return (
                    normal(module.resource)?.includes("/api/") &&
                    normal(module.resource)?.endsWith(".js")
                  );
                })
                .filter((module) => {
                  return module.dependencies?.find((dep) => {
                    return (
                      normal(dep.module?.resource) ===
                      normal(requestModule.resource)
                    );
                  });
                });

              // console.log(`[At ${(Date.now() - startTime) / 1000}s]`);
              console.log(
                "==================== API MODULES READY",
                apiModules.length
              );

              const routeModules = rawModules
                .filter((module) => {
                  return (
                    normal(module.resource)?.includes("/router/") &&
                    normal(module.resource)?.endsWith(".js")
                  );
                })
                .filter((module) => {
                  return module.blocks?.find((block) => {
                    return block.dependencies.find((dep) => {
                      return (
                        normal(dep.module?.resource)?.includes("/pages/") &&
                        normal(dep.module?.resource)?.endsWith(".vue")
                      );
                    });
                  });
                });

              // console.log(`[At ${(Date.now() - startTime) / 1000}s]`);
              console.log(
                "==================== ROUTE MODULES READY",
                routeModules.length
              );

              const pageModules = routeModules
                .map((module) => {
                  return module.blocks
                    ?.map((block) => {
                      return block.dependencies.filter((dep) => {
                        return (
                          normal(dep.module?.resource)?.includes("/pages/") &&
                          normal(dep.module?.resource)?.endsWith(".vue")
                        );
                      });
                    })
                    .flat();
                })
                .flat()
                .map((m) => m.module);

              const routesInfo = []; // [{ moduleRawImportString, routeName }]

              routeModules.forEach((routeModule) => {
                routeModule.parser.hooks.program.tap(
                  "AccessDependenciesPlugin",
                  (ast) => {
                    const astRecursion = (rootNode, rootPath = undefined) => {
                      traverse(
                        rootNode,
                        {
                          ObjectExpression(path) {
                            const componentNode = path.node.properties.find(
                              (i) => i.key.name === "component"
                            );
                            const nameNode = path.node.properties.find(
                              (i) => i.key.name === "name"
                            );
                            const childrenNode = path.node.properties.find(
                              (i) => i.key.name === "children"
                            );

                            if (childrenNode) {
                              astRecursion(childrenNode.value, path);
                            }

                            // console.log(
                            //   "xxx",
                            //   path.node.properties.map(
                            //     (i) => `${i.key.name}: ${i.value.value}`
                            //   )
                            // );

                            if (componentNode && nameNode) {
                              const componentValue = componentNode.value;

                              if (
                                componentValue.type ===
                                  "ArrowFunctionExpression" &&
                                componentValue.body.type === "CallExpression" &&
                                componentValue.body.callee.type === "Import"
                              ) {
                                const moduleRawImportString =
                                  componentValue.body.arguments[0].value;

                                let routeName = null;
                                const nameValue = nameNode.value;
                                if (nameValue.type === "Literal") {
                                  routeName = nameValue.value;
                                } else if (nameValue.type === "Identifier") {
                                  routeName = nameValue.name;
                                } else if (
                                  nameValue.type === "MemberExpression"
                                ) {
                                  routeName = nameValue.property.name;
                                } else {
                                  console.log(nameValue.type);
                                }

                                if (moduleRawImportString && routeName) {
                                  routesInfo.push({
                                    moduleRawImportString,
                                    routeName,
                                  });
                                } else {
                                  // ...
                                }
                              } else {
                                // ...
                              }
                            }
                          },
                        },
                        {},
                        rootPath
                      );
                    };

                    astRecursion(ast);
                  }
                );

                routeModule.parser.parse(routeModule._source.source(), {
                  current: routeModule,
                  module: routeModule,
                  compilation: compilation,
                  options: routeModule.parser.options,
                });
              });

              pageModules.forEach((pageModule) => {
                const routeInfo = routesInfo.find(
                  (routes) =>
                    routes.moduleRawImportString === pageModule.rawRequest
                );

                console.log(
                  reducePath(pageModule.resource),
                  routeInfo ? routeInfo.routeName : "❌ Route name not found ❌"
                );
              });

              // console.log(`[At ${(Date.now() - startTime) / 1000}s]`);
              console.log(
                "==================== PAGE MODULES READY",
                pageModules.length
              );

              const apiFnSourceMeta = new Map(); // { '/src/api/x.js-postX': { magicComments: [{ ... }] } }

              for (const module of pageModules) {
                const pageModulePath = reducePath(normal(module.resource));

                const routeInfo = routesInfo.find(
                  (i) => i.moduleRawImportString === module.rawRequest
                );

                console.log(
                  pageModulePath,
                  routeInfo
                    ? `[${routeInfo.routeName}]`
                    : "❌ Route name not found ❌"
                );

                const matched = [];

                const rev = (module, dep, parentResourceValues) => {
                  if (!module || !module.resource) return;

                  const modulePath = reducePath(normal(module.resource));

                  if (modulePath.includes("/utils/")) return;
                  if (modulePath.includes("/i18n/")) return;

                  if (
                    parentResourceValues.filter((i) => i === module.resource)
                      .length > 2
                  ) {
                    // console.log("ops! deep path: ", parentResourceValues);
                    return;
                  }

                  if (
                    apiModules.find((m) => m.resource === module.resource) &&
                    dep?.name
                  ) {
                    const label = `${pageModulePath}:${dep.name}`;
                    const target = matched.find((i) => i.label === label);

                    if (!target) {
                      // !
                      const record = {
                        label,

                        modulePath,
                        fnName: dep.name,

                        dep,
                        module,

                        from: [parentResourceValues],
                      };
                      matched.push(record);
                    } else {
                      target.from.push(parentResourceValues);
                    }

                    // console.log(`[Hit deep: ${parentResourceValues.length}]`);
                  } else {
                    const deps = module.dependencies
                      .filter((i) => i.name !== "render")
                      .filter((i) => i.name !== "normalizer")
                      .filter((i) => i.name !== "staticRenderFns")
                      .filter(
                        (i) =>
                          i.constructor.name ===
                          "HarmonyImportSpecifierDependency"
                      );

                    if (deps.length) {
                      deps.forEach((i) => {
                        rev(i.module, i, [
                          ...parentResourceValues,
                          module.resource,
                        ]);
                      });
                    } else {
                      // console.log(
                      //   `[Miss deep: ${parentResourceValues.length}]`,
                      //   parentResourceValues
                      // );
                    }
                  }
                };

                rev(module, null, []);

                matched.sort(
                  (a, b) => a.modulePath.length - b.modulePath.length
                );

                matched.forEach((item) => {
                  const { modulePath, fnName, module } = item;
                  const fnKey = `${modulePath}-${fnName}`;

                  if (apiFnSourceMeta.has(fnKey)) {
                    item.apiFnSourceMeta = apiFnSourceMeta.get(fnKey);
                  } else {
                    const meta = {
                      magicComments: [],
                    };
                    const sourceDep = module.dependencies.find(
                      (i) =>
                        i.constructor.name ===
                          "HarmonyExportSpecifierDependency" &&
                        i.name === fnName
                    );
                    const startPos = sourceDep.loc.start;
                    const endPos = sourceDep.loc.end;
                    const sourceFileContent = module._source._value;

                    const findIndexByPos = (content, { line, column }) => {
                      if (line === 0) return column;

                      let lastIndex = 0;
                      for (let index = 1; index < line; index++) {
                        lastIndex = content.indexOf("\n", lastIndex + 1);
                      }
                      return lastIndex + column + 1;
                    };

                    const startIndex = findIndexByPos(
                      sourceFileContent,
                      startPos
                    );
                    const endIndex = findIndexByPos(sourceFileContent, endPos);

                    const fnSourceCode = sourceFileContent.slice(
                      startIndex,
                      endIndex
                    );

                    const magicRawComments =
                      fnSourceCode.match(/API\s*\[(.*?)\]/g);

                    if (magicRawComments) {
                      const magicComments = magicRawComments.map((i) => {
                        const rawString = i.split(/\[|\]/)[1];
                        const [method, url, shortCode, name] =
                          rawString.split(/\s+/);
                        return {
                          method,
                          url,
                          shortCode,
                          name,
                        };
                      });
                      meta.magicComments = magicComments;
                    }

                    item.apiFnSourceMeta = meta;
                    apiFnSourceMeta.set(fnKey, meta);
                  }
                });

                matched.forEach(
                  ({ modulePath, fnName, from, apiFnSourceMeta }) => {
                    console.log(
                      `\t\t${modulePath} | ${fnName}(${from.length} times) | ${
                        apiFnSourceMeta.magicComments.length
                          ? apiFnSourceMeta.magicComments
                              .map(
                                (i) =>
                                  `[${i.method} ${i.url} ${i.shortCode} ${i.name}] ${routeInfo.routeName}_${i.shortCode}`
                              )
                              .join(" ")
                          : "❌ Need API magic comments ❌"
                      }`
                    );
                  }
                );

                // console.log(`[At ${(Date.now() - startTime) / 1000}s]`);
              }

              console.log("==================== END");
              console.log(`[At ${(Date.now() - startTime) / 1000}s]`);
            }
          }
        );
      }
    );
  }
}

module.exports = {
  configureWebpack: {
    plugins: [new AccessDependenciesPlugin()],
  },
};
