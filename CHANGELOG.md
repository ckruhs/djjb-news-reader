# Changelog

## [Unreleased]

### Fixed
- Fixed XML feed handling to properly handle feeds without XML declarations
- Updated production build configuration to use "." as base href instead of "/"
- Improved error handling in feed service for XML parsing

### Changed
- Updated feed service to be more robust with various XML formats
- Modernized build command to use `--configuration production` instead of deprecated `--prod` flag