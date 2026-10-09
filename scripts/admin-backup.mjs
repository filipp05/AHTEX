import { JsonStore } from '../server/store.mjs'
import { backupStore, restoreStore } from '../server/backup.mjs'
const store=new JsonStore(process.env.DATA_DIR||'./.local/data')
if(process.argv[2]==='restore'){
 if(!process.argv[3]||process.argv[4]!=='--confirm')throw new Error('Usage: admin:backup restore PATH --confirm')
 await restoreStore(store,process.argv[3]);console.log('Backup restored; all sessions revoked')
}else{
 if(!process.env.BACKUP_DIR)throw new Error('Set BACKUP_DIR to a directory outside DATA_DIR')
 console.log('Backup created:',await backupStore(store,process.env.BACKUP_DIR))
}
