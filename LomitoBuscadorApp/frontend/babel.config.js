module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@components': './src/components',
            '@services': './src/services',
            '@utils': './src/utils',
            '@navigation': './src/navigation',
            '@context': './src/context',
            '@assets': './src/assets',
          },
        },
      ],
    ],
  };
};