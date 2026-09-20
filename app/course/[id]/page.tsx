'use client';
import {useParams} from 'next/navigation';
import {CourseWorkspace} from '@/components/CourseWorkspace';
export default function Page(){const params=useParams();return <CourseWorkspace id={String(params?.id||'')}/>;}
