{
  description = "parametric-diagrams — dev shell with Node and Playwright (browsers from nixpkgs)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      # Systems we provide a dev shell for.
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          inherit (pkgs) lib;
          playwright = pkgs.playwright-driver;
          # The browsers Playwright downloads are dynamically linked and do not
          # run on NixOS; use the store-patched ones from nixpkgs instead.
          # Only available/needed on Linux — macOS runs the downloaded binaries fine.
          onLinux = pkgs.stdenv.hostPlatform.isLinux;
        in
        {
          default = pkgs.mkShell (
            {
              packages = [ pkgs.nodejs_22 ]
                ++ lib.optional onLinux playwright.browsers;

              shellHook = ''
                echo "parametric-diagrams dev shell"
                echo "  node               $(node --version)"
                echo "  playwright-driver  ${playwright.version}"
                echo ""
                echo "  Pin the npm package to the driver version so the browser"
                echo "  revisions match:  npm i -D @playwright/test@${playwright.version}"
              '';
            }
            // lib.optionalAttrs onLinux {
              # Point Playwright at the nixpkgs-built browsers and skip the host
              # dependency check (the store binaries already carry their deps).
              PLAYWRIGHT_BROWSERS_PATH = "${playwright.browsers}";
              PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
            }
          );
        });
    };
}
