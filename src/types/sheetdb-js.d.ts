declare module "sheetdb-js" {
  type SheetDBCreateData = Record<string, any> | Record<string, any>[];

  class SheetDB {
    constructor(apiUrl: string);
    read(query?: object): Promise<any[]>;
    create(data: SheetDBCreateData): Promise<any>;
    update(key: string, value: string, data: Record<string, any>): Promise<any>;
    delete(key: string, value: string): Promise<any>;
  }

  export default SheetDB;
}
