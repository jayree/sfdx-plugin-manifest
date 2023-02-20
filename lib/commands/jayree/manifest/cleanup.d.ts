import { SfCommand } from '@salesforce/sf-plugins-core';
export default class CleanupManifest extends SfCommand<void> {
    static readonly summary: string;
    static readonly description: string;
    static readonly examples: string[];
    static readonly requiresProject = true;
    static readonly flags: {
        manifest: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        file: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
    };
    run(): Promise<void>;
    private cleanupManifestFile;
}
