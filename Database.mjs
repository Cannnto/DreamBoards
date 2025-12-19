const sqlite3 = await sqlite3InitModule();
const db = new sqlite3.oo1.DB("/mydb.sqlite3", "ct");

export default function(SQL, mode="object")
{   let array = [];
    db.exec({
        sql: SQL,
        rowMode: mode,
        resultRows: array
    });
    return array;
}