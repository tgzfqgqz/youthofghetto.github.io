import {ownerIdentity} from '../../../lib/admin-auth';
import {chatGPTSignInPath} from '../../chatgpt-auth';
import Login from '../login';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false}};
export default async function Activate(){if(!await ownerIdentity())return <main className="gate"><a className="logo" href="/">YOG®</a><h1>Owner access.</h1><p>Verify the store owner’s ChatGPT account to create or recover your username and password.</p><a className="button" href={chatGPTSignInPath('/admin/activate')} target="_top">Verify owner with ChatGPT ↗</a><a href="/admin">Back to admin login</a></main>;return <Login activate/>}
