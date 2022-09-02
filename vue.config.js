const path = require("path");

class AccessDependenciesPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      "AccessDependenciesPlugin",
      (compilation) => {
        compilation.hooks.finishModules.tap(
          "AccessDependenciesPlugin",
          (modules) => {
            if (
              modules.find((i) => i.resource && i.resource.endsWith("main.js"))
            ) {
              console.log("==================== START");

              const currentProjectPath = path.resolve("./");

              const results = modules.map((module) => {
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
              });

              results
                .filter((i) => i.modulePath && i.issuerPath)
                .map((i) => {
                  return {
                    ...i,
                    modulePath: i.modulePath
                      .replace(currentProjectPath, "")
                      .replace("\\", "/"), // for windows
                    issuerPath: i.issuerPath.replace(currentProjectPath, ""),
                  };
                })
                .filter((i) => {
                  return ![
                    // excludes
                    i.modulePath.startsWith("/node_modules"),
                    i.modulePath.startsWith("/src/assets"),
                  ].some(Boolean);
                })
                .forEach((i) => {
                  console.log(i);
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
