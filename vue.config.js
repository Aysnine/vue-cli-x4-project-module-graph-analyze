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

              // console.log(
              //   rawModules.forEach((i) => {
              //     console.log(i.resource);
              //     console.log(i.issuer?.dependencies?.map((i) => i.name));
              //   })
              // );

              const currentProjectPath = path.resolve("./");

              const modules = rawModules
                .map((module) => {
                  const modulePath = module.resource;
                  const issuerPath = module.issuer?.resource;

                  let depends = [];
                  if (modulePath && issuerPath) {
                    depends = module.issuer.dependencies.filter(
                      (i) => module.rawRequest === i.userRequest
                    );
                  }

                  return {
                    modulePath,
                    issuerPath,
                    issuerDetail: depends
                      .map((i) => ({ name: i.name }))
                      .filter((i) => i.name || i.id),
                  };
                })
                .filter((i) => i.modulePath && i.issuerPath)
                .filter((i) => i.modulePath !== i.issuerPath)
                .map((i) => {
                  return {
                    ...i,
                    modulePath: i.modulePath
                      .replace(currentProjectPath, "")
                      .replaceAll("\\", "/"), // for windows
                    issuerPath: i.issuerPath
                      .replace(currentProjectPath, "")
                      .replaceAll("\\", "/"), // for windows
                  };
                })
                .filter((i) => {
                  return ![
                    // excludes
                    i.modulePath.startsWith("/node_modules"),
                    i.modulePath.startsWith("/src/assets"),
                  ].some(Boolean);
                });

              // * find relation: page to api-fn
              modules
                .filter(
                  (i) =>
                    i.modulePath.includes("/api/") &&
                    i.issuerDetail.some((i) => i.name)
                )
                .map((i) => {
                  const rev = (ps) => {
                    const parent = modules.find(
                      (i) => i.modulePath === ps[ps.length - 1].issuerPath
                    );
                    return parent ? rev([...ps, parent]) : ps;
                  };
                  return rev([i]);
                })
                .map((i) => i.reverse())
                .map((i) => {
                  const page = i.find((m) => m.modulePath.endsWith(".vue"));
                  return [page, i[i.length - 1]];
                })
                .forEach(([pageModule, apiModule]) => {
                  console.log(
                    pageModule.modulePath,
                    apiModule.modulePath,
                    apiModule.issuerDetail.map((i) => i.name)
                  );
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
