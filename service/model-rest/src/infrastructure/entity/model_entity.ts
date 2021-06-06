export interface ModelEntity {
    _id: string;
    name: string;
    json: string;
    inputShape: (number | null)[];
    outputShape: (number | null)[];
    createdTime: number;
    updatedTime: number;
}
