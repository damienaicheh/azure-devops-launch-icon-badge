# Launch Icon Badge

## Quick overview

The task available in this extension is:

- LaunchIconBadge

Check the [Github](https://github.com/damienaicheh/azure-devops-launch-icon-badge) repository for more informations!

## Basic usage

```yml
- task: LaunchIconBadge@1
  inputs:
    sourceFolder: '$(Build.SourcesDirectory)' # Optional. Default is: $(Build.SourcesDirectory)
    contents: '**/*.png' # Optional. Default is:  '**/*.png'
    bannerVersionNamePosition: 'bottomRight' # Options: topLeft, topRight, bottomRight, bottomLeft. Default is: 'bottomRight'
    bannerVersionNameText: 'Prerelease'  # Optional. Default is: ''
    bannerVersionNameColor: '#C5000D' # Optional. Default is: '#C5000D'
    bannerVersionNameTextColor: '#FFFFFF' # Optional. Default is: '#FFFFFF'
    bannerVersionNumberPosition: 'top' # Optional. top, bottom, none. Default is: 'none'
    bannerVersionNumberText: '1.2.3' # Optional. Default is: ''
    bannerVersionNumberColor: '#34424F' # Optional. Default is: '#34424F'
    bannerVersionNumberTextColor: '#FFFFFF' # Optional. Default is: '#FFFFFF'
```
