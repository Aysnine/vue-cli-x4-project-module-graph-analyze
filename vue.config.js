const path = require("path");

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

              console.log(`[At ${(Date.now() - startTime) / 1000}s]`);
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

              console.log(`[At ${(Date.now() - startTime) / 1000}s]`);
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

              console.log(`[At ${(Date.now() - startTime) / 1000}s]`);
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

              console.log(`[At ${(Date.now() - startTime) / 1000}s]`);
              console.log(
                "==================== PAGE MODULES READY",
                pageModules.length
              );

              for (const module of pageModules) {
                const pageModulePath = reducePath(normal(module.resource));

                console.log(pageModulePath);

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

                matched.forEach(({ modulePath, fnName, from }) => {
                  console.log(`\t\t${modulePath} | ${fnName} | ${from.length}`);
                });

                console.log(`[At ${(Date.now() - startTime) / 1000}s]`);
              }

              console.log("==================== END");
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
