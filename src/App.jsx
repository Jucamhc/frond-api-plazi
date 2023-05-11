import { useState, useEffect } from 'react';
import { FaTwitter, FaMailBulk } from 'react-icons/fa';
import { FcApproval } from "react-icons/fc";
import { TbWorldWww } from "react-icons/tb";
import { BsFacebook } from "react-icons/bs";
import { fetchData } from './fetchData';

const App = () => {

  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false); 

  const busUser = async () => {
    const userName = document.getElementById("userName").value;
    if (userName) {
      const apiData = await fetchData(userName);
      setData(apiData);
    }
    userName.value = ""
  };

  useEffect(() => {
    if (!loaded) {
      const firts = async () => {
        const apiData = await fetchData("Jucamhc");
        setData(apiData);
        setLoaded(true);
      }
      firts();
    }
  }, [loaded]);


  return (
    <div className='mt-6 justify-center' >

      <div className='flex justify-center border-3 w-[600] pb-5  m-[auto]' >
        <input type="text" id='userName' placeholder="Escribe Tu Perfil" className=' text-center rounded-lg w-96 border-2 bg-[#121f3d] text-white border-green-500' />
        <button id="btnbus" onClick={() => { busUser() }} className='rounded-lg border-2 border-green-500 text-white ml-2 w-32 h-8'>Buscar</button>
      </div>


      <div id='tt' className='w-[700px] h-[600px]  justify-center rounded-[5%] m-[auto] text-white pt-2 pl-2 pr-2'>
        <div className='flex justify-between '>

          <div style={{ flexDirection: 'column', alignItems: 'center', }}>
            <img src={data?.avatar} className='w-[100%] rounded-full ' />
            <div className="">
              <p className="flex text-sm justify-center"><FcApproval />{data?.username}  </p>
              <div className='flex gap-x-2 justify-center'>

                {data?.socials?.map((social) => (
                  social.type === "twitter" && (
                    <span key={social.id}>
                      <a href={`//twitter.com/intent/user?user_id=${social.id}`} target='_blank' rel="noreferrer">
                        <FaTwitter />
                      </a>
                    </span>
                  )
                ))}

                {data?.socials?.map((social) => (
                  social.type === "facebook" && (
                    <span key={social.id}>
                      <a href={`//facebook.com/${social.id}`} target='_blank' rel="noreferrer">
                        <BsFacebook />
                      </a>
                    </span>
                  )
                ))}

                {data?.socials?.map((social) => (
                  social.type === "google-oauth2" && (
                    <span key={social.id}>
                      <a title={social.id}>
                        <FaMailBulk />
                      </a>
                    </span>
                  )
                ))}

                {typeof data?.url === "string" && data?.url !== "" && (
                  <span>
                    <a href={data?.url} target='_blank' rel="noreferrer">
                      <TbWorldWww />
                    </a>
                  </span>
                )}
                <span>
                  <img className='w-[30px] h-[100%] items-center' src={data?.flag} />
                </span>

              </div>
            </div>
          </div>
          <div className='pl-4 w-[70%]' style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>

            <div className='flex justify-center text-2xl font-semibold text-center w-[100%] pb-2'>
              <h1>{data?.name} </h1>
            </div>

            <div className='flex justify-evenly w-[100%] text-center text-sm bg-blue-900 bg-opacity-30  rounded-lg p-1 border border-white'>
              <div className=' '>
                <h3>{data?.points}</h3>
                <h3 className='font-semibold'>Puntos</h3>
              </div>
              <div className='  '>
                <h3>{data?.questions}</h3>
                <h3 className='font-semibold'>Preguntas</h3>
              </div>
              <div className=' '>
                <h3>{data?.answers}</h3>
                <h3 className='font-semibold'>Respuestas</h3>
              </div>
              <div className=' '>
                <h3>{data?.courses?.length || 0}</h3>
                <h3 className='font-semibold'>Cursos</h3>
              </div>
            </div>

            <div className='flex  justify-center pt-3'>
              <div className='w-[100%] flex justify-center bg-blue-900 bg-opacity-30 text-sm rounded-lg p-2 border border-white'>
                <h3>{data?.bio}</h3>
              </div>
            </div>

          </div>
        </div>

        <div className='flex justify-between '>
          <div className='w-[100%]'>
            <p className="text-xl font-semibold text-center">Cursos</p>
          </div>
        </div>

        <div className="relative overflow-auto touch-pan-y h-[50%]" >
          <ul role="list" className="divide-y divide-gray-100 pr-3 pl-3">

            {data?.courses?.map((userData) => (

              <li key={data?.id} className="flex  justify-between gap-x-6 py-4">
                <div className="flex gap-x-2">
                  <img className="h-12 w-12 flex-none rounded-full " src={userData?.badge} />
                  <div className="min-w-0 flex-auto ">
                    <p className="w-[100%] text-sm font-semibold pt-1 leading-5 ">{userData?.title}</p>
                  </div>
                </div>
                <div className="hidden sm:flex w-[40%] sm:flex-col sm:items-end">
                  <span>
                    <a href={`https://platzi.com` + userData?.diploma_link} target='_blank' rel="noreferrer" className="text-sm  border border-white rounded-lg p-1">Visualizar Diploma</a>
                  </span>
                  <p className="mt-1 text-xs leading-4">Terminado {userData?.completed}%</p>
                </div>
              </li>
            ))}
          </ul>

        </div>

      </div>
    </div >
  );
}

export default App;
