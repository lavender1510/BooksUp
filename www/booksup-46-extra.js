/* Local-only edition editing. Catalogue APIs and price sources are retired. */
let bu46IsbnBookId=null;
function bu46MoreBooks(){ALL.recCycle=(Number(ALL.recCycle)||0)+1;persist();render();}
async function bu46IsbnDialog(id){
 const book=[...S.books,...bu45Extra()].find(x=>String(x.id)===String(id));if(!book)return;
 const proposed=prompt('ISBN-10 oder ISBN-13 eingeben:',book.isbn||'');
 if(proposed===null)return;
 const isbn=isbnClean(proposed);
 if(!isbnValid(isbn))return toast('ISBN nicht gültig. Prüfziffer kontrollieren.');
 book.isbn=isbn;persist();render();
}
async function bu46EnrichBook(){toast('Buchdaten lassen sich lokal in den Buchdetails bearbeiten.');}
