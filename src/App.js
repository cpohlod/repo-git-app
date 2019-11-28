import React from 'react';
import Input from './Input';
import './App.css';

class App extends React.Component {

  state = {
    value: "",
    inputRef: {},
    repositorios:[],
    error:null
  };

  getRef = inputRef => {

    inputRef.addEventListener("keyup", (event) =>{
      event.preventDefault()
      if(event.key === 'Enter'){
        this.add();
      }
    });   
    this.setState({ inputRef });
  };

  add = () => {
    let inputRef = this.state.inputRef;
    if (!this.entradaValida(inputRef.value)){
      return;
    }
    this.addValue(inputRef.value);
    inputRef.value = "";
    this.setState({inputRef});
  };

  entradaValida = (value) => {
    if(!value || value.trim().length <= 0){
      return false;
    }
    if(value[0] ==='-' || value[value.trim().length-1] ==='-' || value.trim().length>=39){
      return false;
    }
    return true;
    //await type(input, 'foo b.ar');
    //assert(count === 0, 'Username should be pre validated to have only alphanumeric and -_ chars.');
    //await type(input, 'foo--bar');
    //assert(count === 0, 'Username should be pre validated to contain only single "-"');
    //await type(input, 'shoul-d-fetch');
    //assert(count === 1, 'Should pass.');
  }
  addValue = value => {
    console.log(value);
    fetch(`https://api.github.com/users/${value}/repos`)
      .then(response => {
        if(response.ok) {
            return response.json();
        } else {
            throw new Error('Não foi possível carregar os repositórios do usuário');
        }
      })
      .then(repositorios => {
        this.setState({ repositorios,
                        error:null});
      })
      .catch(error => {
        console.log(error);
        this.setState({ repositorios: [],
                        error});
    });
    
  };

  render() {
      const {repositorios, error} = this.state;
      return (
        <div className="App">
          <Input getRef={this.getRef} />
          <ul id="myUL">
            {
              (repositorios.length===0 || error !==null) ? (
                (error === null) ? (
                                    <li data-test="sem-repositorios"
                                        key="0">
                                        sem-repositorios
                                    </li>
                                 ) : 
                                   (
                                    <li data-test="nao-encontrado"
                                        key="0">
                                        “404”
                                    </li>
                                   )
              ) :
                
              (
                repositorios.map((el, idx) => (
                  <li data-test="repositorio"
                      key={idx}>
                    {el.html_url}
                  </li>
                ))
              )
            }
          </ul>
      </div>
      );
  } 
}
export default App;
