// import { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { getUser, getRepos, getCommitsTotal, syncCommits, getPRsTotal, syncPRs } from '../services/api';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';

// function Insights() {
//   const { username } = useParams();
//   const [user, setUser] = useState(null);
//   const [repos, setRepos] = useState([]);
//   const [totalCommits, setTotalCommits] = useState(null);
//   const [totalPRs, setTotalPRs] = useState(null);
//   const [error, setError] = useState(null);
//   const [syncingCommits, setSyncingCommits] = useState(false);
//   const [syncingPRs, setSyncingPRs] = useState(false);
//   const navigate = useNavigate();

//   const fetchData = () => {
//     Promise.all([
//       getUser(username),
//       getRepos(username),
//       getCommitsTotal(username),
//       getPRsTotal(username),
//     ])
//       .then(([userResponse, reposResponse, commitsResponse, prsResponse]) => {
//         console.log("Commits Total:", commitsResponse.data);
//         console.log("PRs Total:", prsResponse.data);
//         setUser(userResponse.data);
//         setRepos(reposResponse.data);
//         setTotalCommits(commitsResponse.data.totalCommits);
//         setTotalPRs(prsResponse.data.totalPRs);
//       })
//       .catch((err) => {
//         console.error("Fetch Error:", err);
//         setError(err.message);
//       });
//   };

//   useEffect(() => {
//     fetchData();
//   }, [username]);

//   const handleSyncCommits = async () => {
//     setSyncingCommits(true);
//     try {
//       const syncResponse = await syncCommits(username);
//       setTotalCommits(syncResponse.data.totalCommits);
//       console.log(`Synced ${syncResponse.data.totalCommits} commits`);
//       fetchData();
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setSyncingCommits(false);
//     }
//   };

//   const handleSyncPRs = async () => {
//     setSyncingPRs(true);
//     try {
//       const syncResponse = await syncPRs(username);
//       setTotalPRs(syncResponse.data.totalPRs);
//       console.log(`Synced ${syncResponse.data.totalPRs} PRs`);
//       fetchData();
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setSyncingPRs(false);
//     }
//   };

//   const handleViewCommits = () => {
//     navigate(`/commits/${username}`);
//   };

//   const handleViewTopRepos = () => {
//     navigate(`/top-repos/${username}`);
//   };

//   return (
//     <div className="min-h-screen bg-background p-6 w-full dark">
//       <h1 className="text-3xl text-foreground mb-12 font text-left">Insights for {username}</h1>
//       {error && <p className="text-destructive mb-4">Error: {error}</p>}
//       {user ? (
//         <>
//           <Card className="w-full max-w-2xl mx-auto bg-card text-card-foreground border-border mt-6">
//             <CardHeader>
//               <div className="flex items-center space-x-4">
//                 {user.avatarUrl ? (
//                   <img src={user.avatarUrl} alt={`${username}'s profile`} className="w-16 h-16 rounded-full" />
//                 ) : (
//                   <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
//                     No Photo
//                   </div>
//                 )}
//                 <CardTitle className="text-foreground">{user.username}</CardTitle>
//               </div>
//             </CardHeader>
//             <CardContent>
//               <p className="text-foreground mb-4">{user.bio || 'No bio available'}</p>
//               <div className="space-y-4">
//                 <p className="text-muted-foreground">Repositories: {repos.length} total</p>
//                 <div className="flex items-center justify-between">
//                   <p className="text-muted-foreground">
//                     Commits: {totalCommits !== null ? totalCommits : 'Loading...'}
//                   </p>
//                   <Button
//                     onClick={handleSyncCommits}
//                     disabled={syncingCommits}
//                     className="bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-[#4a2885] disabled:bg-muted"
//                   >
//                     {syncingCommits ? 'Syncing...' : 'Sync Commits'}
//                   </Button>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <p className="text-muted-foreground">
//                     PRs: {totalPRs !== null ? totalPRs : 'Loading...'}
//                   </p>
//                   <Button
//                     onClick={handleSyncPRs}
//                     disabled={syncingPRs}
//                     className="bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-[#4a2885] disabled:bg-muted"
//                   >
//                     {syncingPRs ? 'Syncing...' : 'Sync PRs'}
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//           <div className="mt-6 flex justify-center space-x-6">
//             <span
//               onClick={handleViewCommits}
//               className="text-muted-foreground hover:text-primary cursor-pointer animate-pulse"
//             >
//               Commits Dashboard
//             </span>
//             <span
//               onClick={handleViewTopRepos}
//               className="text-muted-foreground hover:text-primary cursor-pointer animate-pulse"
//             >
//               Explore Top Repos
//             </span>
//           </div>
//         </>
//       ) : (
//         <div className="flex items-center justify-center min-h-[200px]">
//           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
//           <span className="ml-2 text-foreground">Loading...</span>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Insights;

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getRepos, getCommitsTotal, syncCommits, getPRsTotal, syncPRs } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function Insights() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [totalCommits, setTotalCommits] = useState(null);
  const [totalPRs, setTotalPRs] = useState(null);
  const [error, setError] = useState(null);
  const [syncingCommits, setSyncingCommits] = useState(false);
  const [syncingPRs, setSyncingPRs] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [userResponse, reposResponse, commitsResponse, prsResponse] = await Promise.all([
        getUser(username),
        getRepos(username),
        getCommitsTotal(username),
        getPRsTotal(username),
      ]);
      setUser(userResponse.data || {});
      setRepos(reposResponse.data || []);
      setTotalCommits(commitsResponse.data?.totalCommits || 0);
      setTotalPRs(prsResponse.data?.totalPRs || 0);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err.message || "Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [username]);

  const handleSyncCommits = async () => {
    setSyncingCommits(true);
    try {
      const syncResponse = await syncCommits(username);
      setTotalCommits(syncResponse.data.totalCommits || totalCommits);
    } catch (err) {
      setError(err.message || "Failed to sync commits");
    } finally {
      setSyncingCommits(false);
    }
  };

  const handleSyncPRs = async () => {
    setSyncingPRs(true);
    try {
      const syncResponse = await syncPRs(username);
      setTotalPRs(syncResponse.data.totalPRs || totalPRs);
    } catch (err) {
      setError(err.message || "Failed to sync PRs");
    } finally {
      setSyncingPRs(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 w-full dark">
      <h1 className="text-3xl text-foreground mb-12 font text-left">Insights for {username}</h1>
      {error && <p className="text-destructive mb-4">Error: {error}</p>}
      {user ? (
        <>
          <Card className="w-full max-w-2xl mx-auto bg-card text-card-foreground border-border mt-6">
            <CardHeader>
              <div className="flex items-center space-x-4">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={`${username}'s profile`} className="w-16 h-16 rounded-full" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    No Photo
                  </div>
                )}
                <CardTitle className="text-foreground">{user.username || username}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground mb-4">{user.bio || 'No bio available'}</p>
              <div className="space-y-4">
                <p className="text-muted-foreground">Repositories: {repos.length} total</p>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    Commits: {totalCommits !== null ? totalCommits : 'Loading...'}
                  </p>
                  <Button
                    onClick={handleSyncCommits}
                    disabled={syncingCommits}
                    className="bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-[#4a2885] disabled:bg-muted"
                  >
                    {syncingCommits ? 'Syncing...' : 'Sync Commits'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    PRs: {totalPRs !== null ? totalPRs : 'Loading...'}
                  </p>
                  <Button
                    onClick={handleSyncPRs}
                    disabled={syncingPRs}
                    className="bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-[#4a2885] disabled:bg-muted"
                  >
                    {syncingPRs ? 'Syncing...' : 'Sync PRs'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="mt-6 flex justify-center space-x-6">
            <span
              onClick={() => navigate(`/commits/${username}`)}
              className="text-muted-foreground hover:text-primary cursor-pointer animate-pulse"
            >
              Commits Dashboard
            </span>
            <span
              onClick={() => navigate(`/top-repos/${username}`)}
              className="text-muted-foreground hover:text-primary cursor-pointer animate-pulse"
            >
              Explore Top Repos
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-foreground">Loading...</span>
        </div>
      )}
    </div>
  );
}

export default Insights;