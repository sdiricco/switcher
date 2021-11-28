const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            //https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less
            modifyVars: { '@layout-header-height': 'none' },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};