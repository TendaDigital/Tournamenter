import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import ExtensionPage from './ExtensionPage';
import { Alert, Flag } from './Controls';
import { GroupStandings } from './Administration';
import { asList, recordPath, useData } from '../lib/data';

const Bracket = dynamic(() => import('./Bracket'), { ssr: false });
const displayStyles = [
  'page-transitions',
  'view-default',
  'pageview-table',
  'pageview-group',
  'pageview-live-match',
  'pageview-bracket',
  'jquery.bracket.min',
];
const messageColors = {
  primary: '#428bca',
  success: '#5cb85c',
  info: '#5bc0de',
  warning: '#f0ad4e',
  danger: '#d9534f',
};
function Dots({ count, index, select, label }) {
  return (
    <div className="dotstyle dotstyle-scaleup">
      <ul>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className={i === index ? 'current' : ''}>
            <a
              href={'#' + label + '-' + (i + 1)}
              aria-label={label + ' ' + (i + 1)}
              onClick={(e) => {
                e.preventDefault();
                select(i);
              }}
            >
              {i + 1}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
function ScoresBoard({ table, rows, page, count, select }) {
  const headers = table.headers || {};
  return (
    <div className="table-view board no-space">
      <div className="col-md-12 scores-board board">
        <div className="board-heading heading-lg heading-orange">
          <span className="h2 table-title">{table.name}</span>
        </div>
        <div className="board-heading heading-orange">
          <div className="pull-right">
            <Dots count={count} index={page} select={select} label="Table page" />
          </div>
          <span className="h3 table-subtitle">Scores</span>
        </div>
      </div>
      <div className="col-md-12 table-pages">
        <table className="table-bordered table-pretty table-orange">
          <thead>
            <tr>
              <th className="text-right">{headers.rank}</th>
              <th>{headers.team}</th>
              {(headers.scores || []).map((title, i) => (
                <th className="text-right" key={i}>
                  {title}
                </th>
              ))}
              <th className="text-right">{headers.final}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="text-right">{row.rank}</td>
                <td>
                  <Flag country={row.team?.country} /> {row.team?.name}
                </td>
                {(headers.scores || []).map((_, i) => (
                  <td key={i} className="text-right">
                    {row.scores?.[i]?.value ?? '–'}
                  </td>
                ))}
                <td className="text-right">{row.final}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function GroupMatch({ match }) {
  if (match.state === 'ended')
    return (
      <div className="match-item match-ended">
        {['A', 'B'].map((side, i) => {
          const score = match['team' + side + 'Score'];
          const other = match['team' + (i ? 'A' : 'B') + 'Score'];
          return (
            <div
              key={side}
              className={'team-data team-' + (i ? 'right' : 'left') + ' ' + (score > other ? 'winner' : '')}
            >
              <span className="team-score">{score}</span>{' '}
              <span className="team-name">{match['team' + side]?.name}</span>
            </div>
          );
        })}
      </div>
    );
  return (
    <div className={'match-item match-' + match.state}>
      <div className="match-place">
        Day {match.day}, {match.hour}
      </div>
      <div className="match-teams">
        {match.teamA?.name} {match.state === 'playing' && <strong>{match.teamAScore}</strong>} ×{' '}
        {match.state === 'playing' && <strong>{match.teamBScore} </strong>}
        {match.teamB?.name}
      </div>
      <div className="match-field">{match.field}</div>
    </div>
  );
}
function GroupBoard({ group, slice }) {
  if (!group) return null;
  return (
    <div className="container">
      <div className="board no-space col-md-12" style={{ marginTop: 50 }}>
        <div className="board-heading heading-lg heading-orange">
          <h2>{group.name}</h2>
        </div>
        <div className="row">
          <div className="board col-md-7">
            <div className="board-heading heading-orange">
              <h3>SCORES</h3>
            </div>
            <div className="table-pages">
              <GroupStandings publicView rows={slice(group.table || [])} />
            </div>
          </div>
          <div className="matches-board board col-md-5">
            <div className="board-heading heading-orange">
              <h3>MATCHES</h3>
            </div>
            {slice(group.matches || []).map((m) => (
              <GroupMatch key={m.id} match={m} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function Scoreboard({ match }) {
  if (!match) return null;
  return (
    <>
      <div className="field-top shadow-md">
        <div className="field-title">FIELD</div>
        <div className="field">{match.field}</div>
      </div>
      <div className="timer title-top-lg shadow-lg">{match.group?.name}</div>
      {['A', 'B'].map((side, i) => {
        const team = match['team' + side] || {};
        const placement = i ? 'right' : 'left';
        return (
          <div key={side}>
            {team.country && (
              <div className={'flag-3d flag-3d-' + placement}>
                <img
                  className="flag"
                  src={'/flags/4x3/' + encodeURIComponent(String(team.country).toLowerCase()) + '.svg'}
                  alt=""
                />
              </div>
            )}
            <div className={'team ' + placement}>
              <div className="team-score-container">
                <span className="team-score">{match['team' + side + 'Score']}</span>
              </div>
              <div className="team-name-container">
                <div className="team-name">{team.name || '–'}</div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
function Slide({ page, segment, rowLimit, segments, selectSegment, extensions }) {
  const opts = page.options || {};
  const data = asList(page.data);
  const slice = (list) => list.slice(segment * rowLimit, (segment + 1) * rowLimit);
  let content;
  let backgroundColor;
  switch (page.module) {
    case 'pageview-table':
      content = (
        <div className={data.length > 1 ? 'container-fluid' : 'container'}>
          {data.map((table) => (
            <div className={data.length > 1 ? 'col-md-6' : 'col-md-12'} key={table.id}>
              <ScoresBoard
                table={table}
                rows={slice(table.scores || [])}
                page={segment}
                count={segments}
                select={selectSegment}
              />
            </div>
          ))}
        </div>
      );
      break;
    case 'pageview-group':
      content = <GroupBoard group={data[0]} slice={slice} />;
      break;
    case 'pageview-live-match':
      content = <Scoreboard match={data[0]} />;
      break;
    case 'pageview-image':
      content = opts.file && (
        <div className="tr-slide-center">
          <img
            className="img-rounded box-shadow"
            src={opts.file}
            alt=""
            style={{
              height: { small: '50%', big: '100%' }[opts.size] || '70%',
              maxWidth: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      );
      break;
    case 'pageview-message': {
      const type = Object.hasOwn(messageColors, opts.type) ? opts.type : 'info';
      backgroundColor = messageColors[type];
      content = (
        <div className="tr-slide-center">
          <div className="container">
            <div
              className={'alert alert-' + type}
              style={{ textAlign: opts.align || 'center', zoom: Number(opts.size) || 1.5 }}
            >
              <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  table: ({ children }) => (
                    <table className="table table-striped table-bordered">{children}</table>
                  ),
                }}
              >
                {String(opts.message || '')}
              </Markdown>
            </div>
          </div>
        </div>
      );
      break;
    }
    case 'pageview-bracket':
      content = <Bracket data={opts.data} />;
      break;
    default:
      content = <ExtensionPage page={page} descriptor={extensions.find((e) => e.module === page.module)} />;
  }
  return (
    <section className={'pt-page pt-page-current pt-page-scaleUp ' + page.module} style={{ backgroundColor }}>
      {content}
    </section>
  );
}
export function ViewList() {
  const { data, error } = useData('/views/find', 10000);
  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <div className="col-md-8 col-md-offset-2">
        <Alert>{error}</Alert>
        <div className="panel panel-danger">
          <div className="panel-heading">Current Created Views</div>
          <div className="list-group">
            {asList(data).map((v) => (
              <a key={v.id} className="list-group-item" href={recordPath('views/view', v.id)}>
                <h4 className="list-group-item-heading">{v.title}</h4>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
export default function Display({ id, name, extensions = [] }) {
  const { data, error, status } = useData(recordPath('views/find', id), 5000);
  useEffect(() => {
    if (status === 404) location.replace('/views/view');
  }, [status]);
  const [active, setActive] = useState(0);
  const [segment, setSegment] = useState(0);
  const [height, setHeight] = useState(window.innerHeight);
  useEffect(() => {
    const resize = () => setHeight(window.innerHeight);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const pages = (data?.pages || []).filter((p) => String(p.disabled) !== 'true');
  const index = active % (pages.length || 1);
  const page = pages[index];
  const rows = Math.max(1, Math.floor(Number(page?.options?.rows) || Math.max(5, (height - 320) / 35)));
  const rowCount = ['pageview-table', 'pageview-group'].includes(page?.module)
    ? Math.max(
        0,
        ...asList(page.data).map((t) =>
          Math.max(t.scores?.length || 0, t.table?.length || 0, t.matches?.length || 0),
        ),
      )
    : 0;
  const segments = Math.max(1, Math.ceil(rowCount / rows));
  const currentSegment = segment % segments;
  const duration = page?.still
    ? (Number(page.still) * 1000) / segments
    : Number(page?.options?.still) * 1000 || (rowCount ? Math.min(rows, rowCount) * 400 : 3000);
  useEffect(() => {
    if (!page || (pages.length < 2 && segments < 2)) return;
    const timer = setTimeout(
      () => {
        if (currentSegment + 1 < segments) setSegment(currentSegment + 1);
        else {
          setActive((index + 1) % pages.length);
          setSegment(0);
        }
      },
      Math.max(1000, Math.min(duration, 30000)),
    );
    return () => clearTimeout(timer);
  }, [index, page?.id, pages.length, currentSegment, segments, duration]);
  return (
    <>
      <Head>
        {displayStyles.map((key) => (
          <link key={key} rel="stylesheet" href={'/css/' + key + '.css'} />
        ))}
      </Head>
      <div id="wrapper">
        <div id="pages" className="pt-perspective">
          {page && (
            <Slide
              key={page.id}
              page={page}
              segment={currentSegment}
              rowLimit={rows}
              segments={segments}
              selectSegment={setSegment}
              extensions={extensions}
            />
          )}
        </div>
        <div id="page-navigation">
          <Dots
            count={pages.length}
            index={index}
            label="Page"
            select={(i) => {
              setActive(i);
              setSegment(0);
            }}
          />
        </div>
        <footer>
          <span className="logo">
            <img src="/branding.png" alt="" />
          </span>
          <h1 className="title">{data?.name || name}</h1>
          <h2 className="subtitle">{data?.title && '(' + data.title + ')'}</h2>
          <p className="footnote">
            Developed by <a href="https://github.com/TendaDigital">Tenda Digital</a>
          </p>
        </footer>
      </div>
      {error && (
        <div className="lost-connection" role="alert" style={{ display: 'block' }}>
          <div>
            Lost connection…
            <br />
            {error}
          </div>
        </div>
      )}
    </>
  );
}
