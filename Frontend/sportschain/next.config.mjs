import webpack from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Utiliser null-loader pour les fichiers .node et certains modules natifs
    config.module.rules.push({
      test: /\.node$/,
      use: 'null-loader'
    });

    // Utiliser ContextReplacementPlugin pour gérer les dépendances dynamiques
    config.plugins.push(new webpack.ContextReplacementPlugin(
      /mongodb[\/\\]lib/,
      (data) => {
        delete data.dependencies[0].critical;
        return data;
      }
    ));

    // Ajouter des alias pour ignorer les modules spécifiques
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mongodb-js/zstd': false,
      'snappy': false,
      'snappy/package.json': false,
    };

    return config;
  },
};

export default nextConfig;