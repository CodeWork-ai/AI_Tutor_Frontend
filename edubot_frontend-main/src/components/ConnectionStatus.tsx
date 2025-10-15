// import { useState, useEffect } from 'react';
// import { Alert, AlertDescription } from './ui/alert';
// import { Button } from './ui/button';
// import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
// import { apiService } from '../services/api';

// export function ConnectionStatus() {
//   const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
//   const [isRetrying, setIsRetrying] = useState(false);

//   const checkConnection = async () => {
//     try {
//       setStatus('checking');
//       const isConnected = await apiService.testConnection();
//       setStatus(isConnected ? 'connected' : 'disconnected');
//     } catch (error) {
//       setStatus('disconnected');
//     }
//   };

//   const handleRetry = async () => {
//     setIsRetrying(true);
//     await checkConnection();
//     setIsRetrying(false);
//   };

//   useEffect(() => {
//     checkConnection();
//     // Check connection every 30 seconds
//     const interval = setInterval(checkConnection, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   if (status === 'checking') {
//     return (
//       <Alert className="border-blue-200 bg-blue-50">
//         <Loader2 className="size-4 animate-spin" />
//         <AlertDescription>
//           Checking backend connection...
//         </AlertDescription>
//       </Alert>
//     );
//   }

//   if (status === 'connected') {
//     return (
//       <Alert className="border-green-200 bg-green-50">
//         <CheckCircle className="size-4 text-green-600" />
//         <AlertDescription className="text-green-800">
//           Connected to backend at localhost:8000
//         </AlertDescription>
//       </Alert>
//     );
//   }

//   return (
//     <Alert className="border-red-200 bg-red-50">
//       <AlertTriangle className="size-4 text-red-600" />
//       <AlertDescription className="text-red-800">
//         Cannot connect to backend at localhost:8000. Make sure the backend server is running.
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={handleRetry}
//           disabled={isRetrying}
//           className="ml-2 h-6 px-2 text-xs"
//         >
//           {isRetrying ? (
//             <>
//               <Loader2 className="size-3 mr-1 animate-spin" />
//               Retrying...
//             </>
//           ) : (
//             'Retry'
//           )}
//         </Button>
//       </AlertDescription>
//     </Alert>
//   );
// }