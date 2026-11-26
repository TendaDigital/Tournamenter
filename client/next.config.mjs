export default {
  output: 'export',
  outputFileTracingRoot: import.meta.dirname,
  poweredByHeader: false,
  reactStrictMode: true,
  webpack(config, { webpack }) {
    // The elimination bracket widget expects jQuery in its own module scope.
    config.plugins.push(new webpack.ProvidePlugin({ jQuery: 'jquery' }));
    return config;
  },
};
