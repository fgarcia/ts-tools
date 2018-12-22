import webpack from 'webpack'
import { join } from 'path'
import { ITypeScriptLoaderOptions, tsService } from '../src'

export interface IBundleWithLoaderOptions {
    /**
     * Entry path to bundle
     */
    entry: string

    /**
     * Options to provide our loader with
     *
     * @default {colors:false}
     */
    loaderOptions?: ITypeScriptLoaderOptions

    /**
     * Directory path that serves as bundling base path
     */
    context?: string

    /**
     * Loaders to apply before the typescript loader.
     * webpack applies them in reverse order.
     */
    preloaders?: webpack.RuleSetLoader[]
}

// direct path to loader's source
const loaderPath = require.resolve('../src/index.ts')

export async function bundleWithLoader(
    { entry, loaderOptions, context, preloaders = [] }: IBundleWithLoaderOptions
): Promise<{ stats: webpack.Stats, statsText: string }> {
    // clear loader's cache before bundling.
    // cwd is cached on baseHost, and several tests use same fixture with different cwd
    tsService.runningServices = new Map()

    const typescriptLoader: webpack.RuleSetLoader = {
        loader: loaderPath,
        options: { colors: false, ...loaderOptions }
    }

    const compiler = webpack({
        entry,
        context,
        mode: 'development',
        resolve: { extensions: ['.ts', '.tsx', '.js'] },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    // loaders execute in reversed order, so preloaders come last
                    loaders: [typescriptLoader, ...preloaders]
                }
            ]
        }
    })

    // so test output isn't saved on local hard drive
    compiler.outputFileSystem = noopOutputFileSystem

    const stats = await new Promise<webpack.Stats>((res, rej) => {
        compiler.run((e, s) => e ? rej(e) : res(s))
    })

    return { stats, statsText: stats.toString() }
}

const noopOutputFileSystem: webpack.OutputFileSystem = {
    join,
    mkdir(_path, callback) { callback(null) },
    mkdirp(_path, callback) { callback(null) },
    rmdir(_path, callback) { callback(null) },
    unlink(_path, callback) { callback(null) },
    writeFile(_path, _data, callback) { callback(null) }
}
