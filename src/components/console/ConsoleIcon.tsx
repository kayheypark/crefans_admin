const paths:Record<string,string[]>={
 'reserved-handles':['M5 10h14v11H5z','M8 10V7a4 4 0 0 1 8 0v3','M12 14v3'],
 advertising:['M3 10v4h4l9 5V5L7 10H3','M7 14l2 7h3l-2-6','M20 9v6'],
 overview:['M4 11 12 4l8 7','M6 10v10h12V10'],
 invites:['M4 6h16v12H4z','m4 7 8 6 8-6'],
 referrals:['M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1','M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1'],
 beans:['M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0','M10 8h3a2 2 0 0 1 0 4h-3V8m0 4h3a2 2 0 0 1 0 4h-3v-4'],
 revenue:['M5 20V10','M12 20V4','M19 20v-7'],
 memberships:['M3 7h18v12H3z','M3 11h18','M7 15h4'],
 members:['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M17 4a4 4 0 0 1 0 8','M22 21v-2a4 4 0 0 0-3-3.87','M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
 content:['M14 3H6v18h12V7z','M14 3v5h5','M9 12h6','M9 16h4'],
 support:['M20 15a3 3 0 0 1-3 3H8l-4 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z','M8 8h8','M8 12h5'],
 logs:['M5 3h14v18H5z','M8 7h8M8 11h8M8 15h5'],
 settings:['M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1','M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
 collapse:['m14 6-6 6 6 6'],menu:['M4 7h16','M4 12h16','M4 17h16'],user:['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8','M4 21a8 8 0 0 1 16 0'],info:['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18','M12 11v6','M12 7.5v.5'],plus:['M12 5v14','M5 12h14'],operators:['M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z','M9 12l2 2 4-4'],close:['M6 6l12 12','M18 6 6 18'],logout:['M9 5H4v14h5','M13 8l4 4-4 4','M8 12h12'],
};
export function ConsoleIcon({name}:{name:string}){return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{(paths[name]||paths.overview).map((d,i)=><path key={i} d={d}/>)}</svg>;}
