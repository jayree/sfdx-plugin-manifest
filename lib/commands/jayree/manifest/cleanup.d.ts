import { SfCommand } from '@salesforce/sf-plugins-core';
export default class CleanupManifest extends SfCommand<void> {
    static readonly summary: string;
    static readonly description: string;
    static readonly examples: string[];
    static readonly requiresProject = true;
    static readonly flags: {
        manifest: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        file: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    run(): Promise<void>;
    private cleanupManifestFile;
}
