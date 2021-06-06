export interface ModelCreateRequestModel {
    json: string;
}

export interface ModelCreateResponseModel {
    _id: string;
}

export interface ModelVersionCreateModel {
    json: string;
}

export interface ModelVersionDisplayModel {
    _id: string;
    type: string;
    json: string;
    createdTime: number;
    updatedTime: number;
}
