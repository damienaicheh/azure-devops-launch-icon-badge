![Schema](./icon.png)

# Launch Icon Badge

## Install

Available on [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=DamienAicheh.launch-icon-task)

## Features

Draw banners on top of your icons.

## Tutorial
You will find a complete tutorial here:

##### English version :
[https://damienaicheh.github.io/azure/devops/2020/01/09/easily-differentiate-versions-of-your-applications-using-azure-devops-en](https://damienaicheh.github.io/azure/devops/2020/01/09/easily-differentiate-versions-of-your-applications-using-azure-devops-en)

##### French version :
[https://damienaicheh.github.io/azure/devops/2020/01/09/easily-differentiate-versions-of-your-applications-using-azure-devops-fr](https://damienaicheh.github.io/azure/devops/2020/01/09/easily-differentiate-versions-of-your-applications-using-azure-devops-fr)

## Example of variable export for developing the project on a Mac:

```
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
```
