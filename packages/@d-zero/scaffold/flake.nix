{
  # Alternative Node/Yarn version source for Nix-based toolchains, parallel to
  # `volta` / `packageManager` in package.json. This flake is self-contained
  # (it never references another file in this project) so external tools can
  # statically evaluate it without pulling in the rest of the project.
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in {
      packages = forAllSystems (pkgs: {
        toolchain = pkgs.buildEnv {
          name = "toolchain";
          paths = [ pkgs.nodejs_24 pkgs.yarn-berry_4 ];
        };
      });
    };
}
