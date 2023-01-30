import { SfCommand } from '@salesforce/sf-plugins-core';
export default class CleanupManifest extends SfCommand<void> {
    static readonly summary: string;
    static readonly description: string;
    static readonly examples: string[];
    static readonly requiresProject = true;
    static readonly flags: {
        manifest: import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string>;
        file: import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string>;
    };
    run(): Promise<void>;
    private cleanupManifestFile;
}
