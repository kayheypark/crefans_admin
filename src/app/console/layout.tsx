import {ConsoleShell} from '@/components/console/Console';
import {SnackbarProvider} from '@/components/console/Snackbar';
import {ConfirmProvider} from '@/components/console/TypedConfirm';

export default function Layout({children}:{children:React.ReactNode}){return <SnackbarProvider><ConfirmProvider><ConsoleShell>{children}</ConsoleShell></ConfirmProvider></SnackbarProvider>;}
