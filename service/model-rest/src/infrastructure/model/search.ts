export interface FilterRequestModel<T> {
    sort: keyof T;
    desc: boolean;
    search: Partial<T>;
}

export interface FilterResponseModel<T> {
    skip: number;
    limit: number;
    total: number;
    list: T[];
}
