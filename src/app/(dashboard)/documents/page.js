function Documents() {
  return (
    <div className="p-6">
      <div className="flex justify-between">
        <h1 className="text-3xl text-black font-bold mb-4">
          Here are all your documents!
        </h1>
        <div className="text-3xl font-thin text-black ">
          <img
            src="/plus3.svg"
            alt="plus"
            className="w-7 h-7 border-1 rounded-[5px] border-black"
          />
          {/* <span className="font-light">+</span> */}
        </div>
      </div>
    </div>
  );
}

export default Documents;
