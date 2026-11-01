import {ConsoleShell} from '@/components/console/Console';
import {SnackbarProvider} from '@/components/console/Snackbar';

export default function Layout({children}:{children:React.ReactNode}){return <SnackbarProvider><ConsoleShell>{children}</ConsoleShell></SnackbarProvider>;}
