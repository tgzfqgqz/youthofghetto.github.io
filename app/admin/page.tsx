import {actor} from '../../lib/admin-auth';
import Admin from './studio';
import Login from './login';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false}};
export default async function Page(){return await actor()?<Admin/>:<Login/>}
