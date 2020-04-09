import React, { Fragment } from "react";

const NotFound = () => {
  return (
    <Fragment>
      <h1 className='text-large text-primary'>
        <i className='fas fa-exclamation-triangle'></i> Page not found
      </h1>
      <h4 className=''>Sorry, this page does not exist...</h4>
    </Fragment>
  );
};

export default NotFound;
