$env:INPUT_SourceFolder="./AppIcon"
$env:INPUT_Contents="**/*.svg"
$env:INPUT_BannerVersionNamePosition="topRight"
$env:INPUT_BannerVersionNumberPosition="center"
$env:INPUT_BannerVersionNameText="mvp"
$env:INPUT_BannerVersionNameColor="#C5000D"
$env:INPUT_BannerVersionNameTextColor="#FFFFFF"
$env:INPUT_BannerVersionNumberTextColor="#FFFFFF"
$env:INPUT_BannerVersionNumberText="12.34.567"
$env:INPUT_BannerVersionNumberColor="#34424F"
npx tsc
node launch-icon-badge.js