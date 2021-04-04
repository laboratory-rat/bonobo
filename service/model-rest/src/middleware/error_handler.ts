export default (req: Request, res: Response, next: any) => {
    try{
        next();
    } catch(e) {
        console.error(e);
    }
}