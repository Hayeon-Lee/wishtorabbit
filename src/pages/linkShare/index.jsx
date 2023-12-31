import { React, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dbService } from "../../routes/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const SharePage = () => {
  const userID = useParams().userID;
  const [userName, setUserName] = useState(""); //유저이름
  const [userWish, setUserWish] = useState(""); //유저소원
  const [comments, setComments] = useState([]); //유저가 받은 코멘트들

  const [months, setMonths] = useState([]); //달별로 코멘트 정리

  const [clickedMonth, setClickedMonth] = useState(-1); //어떤 달이 클릭됐는지
  const [clickedComments, setClickedComments] = useState([]); //클릭된 달의 코멘트
  const [clickedWish, setClickedWish] = useState(""); //클릭된 달의 소원
  const [openList, setOpenList] = useState(false); //코멘트 목록 접고 열기

  const navigate = useNavigate();

  const getData = async () => {
    //유저 아이디로 이름 찾기
    const findUserQuery = query(
      //인자로 받은 유저아이디를 이용한 유저 이름 찾는 쿼리 작성
      collection(dbService, "user"),
      where("uid", "==", userID)
    );
    const findUser = await getDocs(findUserQuery); // 쿼리 이용하여 유저 아이디 찾기
    findUser.forEach((doc) => {
      setUserName(doc.data().name);
    });

    //유저 아이디로 소원 찾기
    const findWishQuery = query(
      //인자로 받은 유저아이디를 이용한 유저 소원 찾는 쿼리 작성
      collection(dbService, "wish"),
      where("uid", "==", userID)
    );
    const findWish = await getDocs(findWishQuery); //쿼리 이용하여 유저 소원 찾기
    findWish.forEach((doc) => {
      let wishMonth = new Date(doc.data().createdAt.toMillis()).getMonth();
      let currentMonth = new Date().getMonth();
      if (wishMonth === currentMonth) {
        setUserWish(doc.data().content);
      }
      setMonths((months) => [
        { month: wishMonth, wishContent: doc.data().content, comments: [] },
        ...months,
      ]);
      //달과 소원 추가하기
    });

    //유저 아이디로 코멘트 찾기
    const findCommentsQuery = query(
      //인자로 받은 유저아이디를 이용한 유저 코멘트 찾는 쿼리 작성
      collection(dbService, "comment"),
      where("uid", "==", userID)
    );
    const findComments = await getDocs(findCommentsQuery);
    setComments(findComments.docs); //comments에 저장
  };

  //월별 코멘트 저장
  const checkComments = () => {
    for (let i = 0; i < comments.length; i++) {
      let cm = new Date(comments[i].data().createdAt.toMillis()).getMonth();
      for (let j = 0; j < months.length; j++) {
        let wm = months[j].month;
        if (cm === wm) {
          months[j].comments.push({
            key: comments[i].data().cid,
            sender: comments[i].data().sender.sender,
            content: comments[i].data().content.content,
            selectedType: comments[i].data().type.selectTypes,
            createdAt: new Date(
              comments[i].data().createdAt.toMillis()
            ).toString(),
          });
        }
      }
    }
  };

  useEffect(() => {
    reRender();
    getData();
  }, []);

  useEffect(() => {
    checkComments();
  }, [comments]);

  const [init, setInit] = useState(false);
  const reRender = () => {
    setTimeout(() => {
      setInit(true);
    }, 1000);
  };
  //몇월의 떡을 클릭했는지
  const monthBtnClicked = (event) => {
    const preMonth = clickedMonth;
    setClickedMonth((prev) => event.target.value);
    if (clickedMonth !== -1 && preMonth === clickedMonth)
      setOpenList((prev) => !prev);
  };

  //클릭한 월의 comment 배열은 무엇인지
  useEffect(() => {
    for (let i = 0; i < months.length; i++) {
      if (months[i].month == clickedMonth) {
        setClickedComments(months[i].comments);
      }
    }
    setOpenList(true);
  }, [clickedMonth]);

  //클릭한 월의 소원
  useEffect(() => {
    for (let i = 0; i < months.length; i++) {
      if (months[i].month == clickedMonth) {
        setClickedWish(months[i].wishContent);
      }
    }
  }, [clickedComments]);

  if (init === false) {
    return (
      <div>
        <h1>유저 정보 불러오는 중...</h1>
      </div>
    );
  } else if (userName.length === 0) {
    return (
      <div>
        <h1>유저를 찾을 수 없어요🥲</h1>
      </div>
    );
  } else {
    if (userWish.length === 0) {
      return (
        <div>
          <div>
            <h1>{userName}의 소원</h1>
            <span>{userName}님은 아직 이번달에 적은 소원이 없어요🥲</span>
          </div>
          <hr />
          <div>
            {months.map((item) => {
              if (item.comments.length != 0) {
                return (
                  <button
                    key={item.month}
                    value={item.month}
                    onClick={monthBtnClicked}
                  >
                    {item.month + 1}월의 떡
                  </button>
                );
              }
            })}
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <h1>{userName}의 소원</h1>
          <h2>{userWish}</h2>
          <hr />
          <div>
            {months.map((item) => {
              if (item.comments.length !== 0) {
                return (
                  <button
                    key={item.month}
                    value={item.month}
                    onClick={monthBtnClicked}
                  >
                    {item.month + 1}월의 떡
                  </button>
                );
              }
            })}
          </div>
          {openList === false ? null : (
            <div>
              {clickedMonth === -1 ? null : (
                <div>
                  {Number(clickedMonth) + 1}월의 소원: {clickedWish}
                </div>
              )}

              <div>
                {clickedComments.map((item) => {
                  return (
                    <div key={item.key}>
                      <div>
                        {item.sender}: {item.content}({item.selectedType})
                      </div>
                      <div>{item.createdAt}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <hr />
          <button onClick={() => navigate(`/comments/${userID}`)}>
            댓글 달아서 응원해주기
          </button>
        </div>
      );
    }
  }
};

export default SharePage;
