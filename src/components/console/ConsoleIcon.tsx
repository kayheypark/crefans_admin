const paths:Record<string,string[]>={
 overview:['M4 11 12 4l8 7','M6 10v10h12V10'],
 beans:['M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0','M10 8h3a2 2 0 0 1 0 4h-3V8m0 4h3a2 2 0 0 1 0 4h-3v-4'],
 revenue:['M5 20V10','M12 20V4','M19 20v-7'],
 members:['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M17 4a4 4 0 0 1 0 8','M22 21v-2a4 4 0 0 0-3-3.87','M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
 content:['M14 3H6v18h12V7z','M14 3v5h5','M9 12h6','M9 16h4'],
 support:['M20 15a3 3 0 0 1-3 3H8l-4 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z','M8 8h8','M8 12h5'],
 logs:['M5 3h14v18H5z','M8 7h8M8 11h8M8 15h5'],
 settings:['M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1','M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
 collapse:['m14 6-6 6 6 6'],logout:['M9 5H4v14h5','M13 8l4 4-4 4','M8 12h12'],
};
export function ConsoleIcon({name}:{name:string}){return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{(paths[name]||paths.overview).map((d,i)=><path key={i} d={d}/>)}</svg>;}
