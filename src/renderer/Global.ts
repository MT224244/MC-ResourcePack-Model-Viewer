import { ResourcePackLoader } from '@/renderer/ResourcePackLoader';

export class Global {
    public static ResourcePackLoader = new ResourcePackLoader();
    public static SelectedModelId?: string;
}
