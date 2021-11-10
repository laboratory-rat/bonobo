export const visualize3DArray = (matrix: number[][][]) => {
    matrix.forEach((row) => {
        console.log(row.map((r) => r[0]).join(' '));
    });
};
