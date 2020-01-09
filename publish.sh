echo "Publish"

cd launchIconBadgeTask
npm install
tsc
cd ..

tfx extension create --manifest-globs vss-extension.json