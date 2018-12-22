import { loader } from 'webpack'

const samplePreloader: loader.Loader = source => {
    return `const someGlobalVar: string = 'injected via loader'\n` + source.toString('utf8')
}

export default samplePreloader
