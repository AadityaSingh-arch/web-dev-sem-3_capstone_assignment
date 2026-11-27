import { useEffect, useState } from 'react';
import { api } from './api.js';

let cache = null;
export default function useMeta() {
  const [meta, setMeta] = useState(cache);
  useEffect(() => {
    if (!cache) api('/grievances/meta').then((d) => { cache = d; setMeta(d); }).catch(() => {});
  }, []);
  return meta;
}
