"use client";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
export default function SignOutButton(){const router=useRouter();return <button onClick={async()=>{await createClient().auth.signOut();router.push("/");router.refresh();}} className="text-sm font-semibold text-[#52718d]">Log out</button>;}