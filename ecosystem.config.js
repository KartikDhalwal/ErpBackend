module.exports = {
    apps: [{
        name: 'my-new-clustered-app',
        script: 'index.js',
        instances: 6,      // Number of clusters
        exec_mode: 'cluster',  // Cluster mode
    }]
};
