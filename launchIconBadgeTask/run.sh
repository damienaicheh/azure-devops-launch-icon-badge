export INPUT_SourceFolder="./../samples/icons" &&
export INPUT_Contents="**/*.png" &&
export INPUT_BannerVersionNamePosition="bottomRight" &&
export INPUT_BannerVersionNumberPosition="none" &&
export INPUT_BannerVersionNameText="mvp" &&
export INPUT_BannerVersionNameColor="#C5000D" &&
export INPUT_BannerVersionNameTextColor="#FFFFFF" &&
export INPUT_BannerVersionNumberTextColor="#FFFFFF" &&
export INPUT_BannerVersionNumberText="1.2.3" &&
export INPUT_BannerVersionNumberColor="#34424F"
tsc &&
node launch-icon-badge.js