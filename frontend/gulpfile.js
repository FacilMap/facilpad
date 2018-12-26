var gulp = require("gulp");
var gutil = require("gulp-util");
var clean = require("gulp-clean");
var newer = require("gulp-newer");
var fs = require("fs");
var Promise = require("bluebird");
var request = require("request-promise");
var unzip = require("unzipper");
var webpack = require("webpack");

var icons = require("./gulpfile-icons");
var webpackConfig = require("./webpack.config.js");

let webpackCompiler = webpack(webpackConfig);

const staticFrontendFile = `${__dirname}/build/frontend.js`;
const staticClientFile = `${__dirname}/build/client.js`;

function pipe(source, ...transformers) {
	let current = source;
	for (const transformer of transformers) {
		current.on("error", (e) => {
			transformer.emit("error", e);
		});
		current = current.pipe(transformer);
	}
	return current;
}

function doClean() {
	return pipe(
		gulp.src("build"),
		clean()
	);
}

async function downloadIcons() {
	const exists = await new Promise((resolve) => {
		fs.exists("build/Open-SVG-Map-Icons", resolve);
	});

	if(exists)
		return;

	let extract = unzip.Extract({
		path: "build/"
	});

	let download = request.get("https://github.com/twain47/Open-SVG-Map-Icons/archive/master.zip");
	download.pipe(extract);
	download.catch((err) => {
		extract.emit("error", err);
	});

	await extract.promise();

	await Promise.promisify(fs.rename)("build/Open-SVG-Map-Icons-master", "build/Open-SVG-Map-Icons");
}

function compileIcons() {
	return pipe(
		gulp.src(["build/Open-SVG-Map-Icons/svg/**/*.svg", "assets/icons/**/*.svg"]),
		newer("build/icons.js"),
		icons("icons.js", "angular.module(\"facilmap\").constant(\"fmIconsRaw\", %s);"),
		gulp.dest("build")
	);
}

const doIcons = gulp.series(downloadIcons, compileIcons);

function doWebpack() {
	return Promise.promisify(webpackCompiler.run.bind(webpackCompiler))().then(function(stats) {
		gutil.log("[webpack]", stats.toString());

		if(stats.compilation.errors && stats.compilation.errors.length > 0)
			throw new gutil.PluginError("webpack", "There were compilation errors.");

		return new Promise((resolve, reject) => {
			fs.exists(staticFrontendFile, resolve);
		}).then((exists) => {
			if(exists)
				return Promise.promisify(fs.unlink)(staticFrontendFile);
		}).then(() => {
			// Create symlink with fixed file name so that people can include https://facilmap.org/frontend.js
			return Promise.promisify(fs.symlink)(`frontend-index-${stats.hash}.js`, `${__dirname}/build/frontend.js`);
	    });
	});
}

function doSymlinks() {
	// Create symlink to facilmap-client so that people can include https://facilmap.org/client.js
	return new Promise((resolve, reject) => {
		fs.exists(staticClientFile, resolve);
	}).then((exists) => {
		if(!exists)
			return Promise.promisify(fs.symlink)(require.resolve("facilmap-client/build/client"), staticClientFile);
	});
}

function doWatch() {
	webpackCompiler.watch({
	}, function(err, stats) {
        gutil.log("[webpack]", err ? err : stats.toString());
	});
}

module.exports.default = gulp.series(doIcons, doWebpack, doSymlinks);
module.exports.icons = doIcons;
module.exports.watch = gulp.series(doIcons, doWatch);
module.exports.clean = doClean;