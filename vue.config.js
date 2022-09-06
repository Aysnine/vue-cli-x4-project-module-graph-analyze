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
              console.log("==================== START");

              const currentProjectPath = path.resolve("./");
              const reducePath = (absPath) =>
                absPath.replace(currentProjectPath, "");
              const normal = (p) => (p ? p.replaceAll("\\", "/") : p);

              const requestModule = rawModules.find((module) => {
                return normal(module.resource)?.endsWith("utils/request.js");
              });

              if (!requestModule) {
                throw new Error("Can't find request module!");
              }

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

              pageModules.forEach((module) => {
                console.log(reducePath(module.resource));
                const matched = [];

                function rev(module, dep) {
                  if (!module) return;
                  if (
                    apiModules.find((m) => m.resource === module.resource) &&
                    dep?.name
                  ) {
                    const label = `${reducePath(module.resource)}:${dep.name}`;

                    if (!matched.find((i) => i.label === label)) {
                      // !
                      matched.push({
                        label,

                        modulePath: reducePath(module.resource),
                        fnName: dep.name,

                        dep,
                        module,
                      });
                    }
                  } else {
                    module.dependencies.map((i) => rev(i.module, i));
                  }
                }

                rev(module);

                matched.map((i) => {
                  console.log(`\t\t${i.modulePath} | ${i.fnName}`);
                });
              });

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
