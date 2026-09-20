'use client';
import {Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
import {CourseWorkspace} from '@/components/CourseWorkspace';
function QueryCourse(){const params=useSearchParams();return <CourseWorkspace id={params.get('id')||''}/>}
export default function Page(){return <Suspense fallback={<p>Loading course…</p>}><QueryCourse/></Suspense>}
