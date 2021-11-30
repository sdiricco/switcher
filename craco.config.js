const CracoLessPlugin = require("craco-less");

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            //https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less
            modifyVars: {
              "@layout-header-height": "none",
              "@btn-padding-horizontal-base": "0px",
              "@btn-padding-horizontal-sm": "0px",
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
