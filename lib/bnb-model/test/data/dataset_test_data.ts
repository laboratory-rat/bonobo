import { Dataset } from '@lib/dataset';

export const testGetNotIdealXorDataset = (): Dataset => ({
    type: '_table',
    body: [
        [[5], [15], [15]],
        [[1], [1], [1]],
        [[1], [10], [10]],
    ],
    header: [
        {
            decimals: 1,
            index: 0,
            isOutput: false,
            originIndex: 0,
            title: 'Line 1',
            type: '_numberArray',
        },
        {
            decimals: 0,
            index: 1,
            isOutput: false,
            originIndex: 1,
            title: 'Line 2',
            type: '_stringArray',
        },
        {
            decimals: 0,
            index: 2,
            originIndex: 2,
            isOutput: true,
            title: 'Line 3 Output',
            type: '_stringArray',
        },
    ],
    name: 'Test table dataset',
    source: {
        type: 'GOOGLE_SPREADSHEETS',
        link: '',
        sheetId: '',
        spreadsheetId: '',
    },
    createdTime: new Date().getTime(),
    updatedTime: new Date().getTime(),
    size: 3,
});

export const testGetNotIdealXorInput = (): number[][][] => [
    [[2], [10]],
    [[12], [15]],
];
